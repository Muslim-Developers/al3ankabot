<script lang="ts">
  import { Input, Button, List, Li, TextPlaceholder, Heading, P, A, Img } from 'flowbite-svelte';
  import { enhance } from '$app/forms';
  import { uid } from '$lib/helpers/uid';
  import MicIcon from '~icons/mdi/microphone';
  import CameraIcon from '~icons/mdi/camera';
  import VoicemailIcon from '~icons/mdi/voicemail';
  import { onMount } from 'svelte';
  import type { ActionData } from './$types';

  export let form: ActionData;

  let input = '';
  let loading = false;

  const datalistId = uid();
  let suggestions: string[] = [];
  async function updateSuggestions() {
    // TODO: debounce
    if (input.length < 3) {
      suggestions = [];
      return;
    }
    const res = await fetch('/api/suggest?q=' + input);
    const data: string[] = await res.json();
    suggestions = data.slice(0, 5);
  }

  async function fetchRelatedWords() {
    const res = await fetch('/api/related?q=' + input);
    const data: { relatedWords: string[] } = await res.json();
    return data.relatedWords;
  }

  let supportsSpeechRecognition = false;
  let recognition: SpeechRecognition;
  let listening = false;
  onMount(() => {
    window.SpeechRecognition ??= window.webkitSpeechRecognition;
    supportsSpeechRecognition = !!window.SpeechRecognition;
    if (!supportsSpeechRecognition) return;
    recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.interimResults = false;
  });

  function startListening() {
    if (recognition == undefined) return;
    listening = true;
    recognition.onerror = () => (listening = false);
    recognition.onend = () => (listening = false);
    recognition.onresult = (event) => {
      input = event.results[0][0].transcript;
      recognition.onresult = null;
      // TODO: submit form
    };
    recognition.start();
  }

  let email = '';
</script>

<svelte:head>
  <title>معجم الرياض</title>
</svelte:head>

<main class="max-w-4xl mx-auto flex flex-col items-center h-screen justify-center gap-14">
  <img src="logo.png" width="300" alt="" />
  <Heading class="text-center">العنكبوت</Heading>
  <!-- TODO: loading state -->
  <form
    method="POST"
    use:enhance={() => {
      loading = true;
      form = null;
      return ({ update }) => {
        update();
        loading = false;
      };
    }}
    class="flex justify-between w-full px-4 md:w-2/3 gap-4"
  >
    <Input
      bind:value={input}
      placeholder="كلمة البحث"
      name="word"
      list={datalistId}
      on:input={updateSuggestions}
      disabled={loading}
    >
      <div slot="left" class="pointer-events-auto">
        {#if supportsSpeechRecognition}
          <Button on:click={startListening} pill color="none" class="!p-2">
            {#if listening}
              <VoicemailIcon class="animate-pulse" />
            {:else}
              <MicIcon />
            {/if}
          </Button>
        {/if}
        <Button pill color="none" class="!p-2">
          <CameraIcon />
        </Button>
      </div>
    </Input>
    <datalist id={datalistId}>
      {#each suggestions as suggestion}
        <option value={suggestion} />
      {/each}
    </datalist>
    <Button type="submit" disabled={loading}>بحث</Button>
  </form>

  <section>
    {#if loading}
      <p>جاري البحث...</p>
    {/if}
    {#if form != null}
      <p class="text-xl">نتائج البحث:</p>
      <List list="none">
        {#each form as { word, dictionaryUrl, definition, example, imgUrl }}
          <Li>
            <Heading tag="h2" class="py-4">{word}</Heading>
            {#if definition}
              <P align="right">{definition}</P>
            {/if}
            {#if example}
              <P align="right" class="py-4">مثال: {example}</P>
            {/if}
            {#if imgUrl}
              <Img src={imgUrl} class="w-full px-2 md:w-1/2 md:px-0" />
            {/if}
            <br />
            <A href={dictionaryUrl} target="_blank" class="py-4">
              اذهب إلى المدخل الكامل في معجم الرياض
            </A>
          </Li>
        {:else}
          لم يتم العثور على نتائج. سيقوم العنكبوت الآن بالبحث عن هذه الكلمة وإضافتها. برجاء المراجعة
          في وقت لاحق. يمكنك إدخال بريدك الإلكتروني لتصلك رسالة حين تتم إضافة الكلمة:
          <Input type="email" disabled={loading} bind:value={email} class="max-w-sm mx-2 inline" />
          <Button
            type="button"
            disabled={loading}
            on:click={() => {
              loading = true;
              setTimeout(() => {
                email = '';
                loading = false;
              }, 1500);
            }}
          >
            أرسل
          </Button>
        {/each}
      </List>
    {/if}
  </section>
</main>
